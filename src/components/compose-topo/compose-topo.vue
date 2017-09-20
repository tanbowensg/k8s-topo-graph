<template>
  <div id="compose-topo-container">
    <div id="dce-compose-topo">
      <header id="dce-compose-topo-header">
        <div id="app-name">ndc/my-app</div>
        <ul id="pages">
          <li class="page" :class="{active: tab === 'deployments'}" @click="tab = 'deployments'">服务</li><!--
       --><li class="page" :class="{active: tab === 'services'}" @click="tab = 'services'">网络</li><!--
       --><li class="page" :class="{active: tab === 'volumes'}" @click="tab = 'volumes'">存储</li>
        </ul>
      </header>
      <div id="dce-compose-topo-body">
        <topo-canvas v-if="tab === 'deployments'" :nodes="deploymentViewNodes" key="deployments"></topo-canvas>
        <topo-canvas v-if="tab === 'services'" :nodes="serviceViewNodes" key="services"></topo-canvas>
        <topo-canvas v-if="tab === 'volumes'" :nodes="volumeViewNodes" key="volumes"></topo-canvas>
        <code-section :yaml="yaml"></code-section>
      </div>
    </div>
  </div>
</template>

<script>
import yaml2json from 'js-yaml';
import TopoCanvas from '../topo-canvas/topo-canvas';
import CodeSection from '../code-section/code-section';
import Bus from '../bus.js';

export default {
  name: 'ComposeTopo',
  props: ['rawData'],
  components: {
    CodeSection,
    TopoCanvas
  },
  data() {
    return {
      yaml: this.rawData,
      tab: 'deployments',
    }
  },
  created() {
    Bus.$on('yaml-change', yaml => {
      this.yaml = yaml;
    });
  },
  computed: {
    json() {
      return yaml2json.safeLoadAll(this.yaml);
    },
    deployments() {
      const deployments = _.filter(this.json, v => v.kind === 'Deployment');

      function getDeploymentDependencies(deployment) {
        const dependencies =  _.get(deployment, 'metadata.annotations["io.daocloud.dce/depend-on"]') || [];
        // yaml 里本来保存的是名字，这里要转换成 ID，由于这里都是服务和服务的依赖，所以就不判断 kind 了
        return _.map(dependencies, dName => `Deployment_${dName}`);
      }

      function getVolumes(deployment) {
        const containers =  _.get(deployment, 'spec.template.spec.containers') || [];
        const volumes = _.reduce(containers, (all, c) => {
          return all.concat(c.volumeMounts || []);
        }, []);
        // yaml 里本来保存的是名字，这里要转换成 ID，由于这里都是服务和服务的依赖，所以就不判断 kind 了
        return _.map(volumes, v => `Volume_${v.name}`);
      } 

      // 处理各个节点要展示的数据
      return _.map(deployments, deployment => {
        return  {
          id: `Deployment_${deployment.metadata.name}`,
          type: 'deployment',
          name: deployment.metadata.name,
          app: _.get(deployment, 'spec.template.metadata.labels.app', ''),
          // 表示它依赖的服务
          deployments: getDeploymentDependencies(deployment),
          volumes: getVolumes(deployment),
          values: [
            ['镜像', _.get(deployment, 'spec.template.spec.containers[0].image', '')],
            ['实例数', _.get(deployment, 'spec.replicas', 0)],
            ['CPU 限制', _.get(deployment, 'spec.template.spec.containers[0].resources.limits.cpu', 0)],
            ['内存限制', _.get(deployment, 'spec.template.spec.containers[0].resources.limits.memory', 0)],
          ],
        };
      });
    },
    // 服务视图所需的节点和依赖关系
    deploymentViewNodes() {
      // 先取出所有服务的依赖，用于判断一个服务是否有依赖
      const allDependencies = _.reduce(this.deployments, (all, deployment) => {
        return all.concat(deployment.deployments);
      }, []);

      // 处理各个节点要展示的数据
      return _.map(this.deployments, deployment => {
        const d = _.clone(deployment);
        d.dependencies = deployment.deployments;
        // 是否拥有依赖
        d.hasDependency = d.dependencies.length > 0;
        // 是否是其他节点的依赖
        d.isDependency = allDependencies.indexOf(deployment.id) > -1;
        return d;
      });
    },
    services() {
      const services = _.filter(this.json, v => v.kind === 'Service');

      // 处理各个节点要展示的数据
      return _.map(services, service => {
        function formatPort(port) {
          const protocol = port.protocol === 'UDP' ? 'UDP' : 'TCP';
          const nodePort = port.nodePort ? `${port.nodePort}:` : '';
          return `${nodePort}${port.port}/${protocol}`;
        }
        const typeTable = {
          ClusterIP: '服务端口',
          NodePort: '主机端口',
        };
        return  {
          id: `Service_${service.metadata.name}`,
          type: 'service',
          name: service.metadata.name,
          app: _.get(service, 'spec.selector.app', ''),
          values: [
            ['模式', typeTable[_.get(service, 'spec.type', 'ClusterIP')]],
            ['端口', _.map(_.get(service, 'spec.ports', []), formatPort).join(',')],
          ],
        };
      });
    },
    // 服务视图所需的节点和依赖关系
    serviceViewNodes() {
      const serviceViewNodes = _.map(this.services, service => {
        const s = _.clone(service);
        // 网络的依赖只有服务
        s.dependencies = _.filter(this.deployments, d => d.app === s.app).map(d => d.id);
        s.hasDependency = s.dependencies.length > 0;
        // 网络永远不会被依赖
        s.isDependency = false;
        return s;
      })
      // 被网络依赖的所有服务
      const dependedDeployements = _.reduce(serviceViewNodes, (all, service) => {
        const deployments = _.map(service.dependencies, dId => 
          _.find(this.deployments, { id: dId }));
        return all.concat(deployments);
      }, [])
      // 最后返回网络和服务的节点
      return serviceViewNodes.concat(dependedDeployements);
    },
    volumes() {
      const deployments = _.filter(this.json, v => v.kind === 'Deployment');
      // 这个是所有的存储卷，其中保存的是 name 和 claimName
      const volumes = _.reduce(deployments, (volumes, d) => {
        return volumes.concat(_.get(d, 'spec.template.spec.volumes', []));
      }, []);
      // 这个是被依赖的存储卷，其中保存的是存储卷的 id
      const dependedVolumes = _.reduce(this.deployments, (volumes, d) => {
        return volumes.concat(d.volumes);
      }, []);
      return _.map(volumes, v => {
        return {
          // id 是 Volume_name
          id: `Volume_${v.name}`,
          name: v.name,
          claimName: _.get(v, 'persistentVolumeClaim.claimName', v.name),
          type: 'volume',
          dependencies: [],
          hasDependency: false,
          isDependency: _.includes(dependedVolumes, `Volume_${v.name}`),
          values: [
            ['', '', '存储卷']
          ],
        }
      })
    },
    // 存储视图所需的节点和依赖关系
    volumeViewNodes() {
      // 依赖存储的所有服务
      const dependingDeployements = _.filter(this.deployments, d => d.volumes.length > 0);

      // 把和存储的依赖关系写入服务中
      const dependingDeployementsNodes = _.map(dependingDeployements, deployment => {
        const d = _.clone(deployment);
        d.dependencies = deployment.volumes;
        // 是否拥有依赖
        d.hasDependency = d.dependencies.length > 0;
        // 是否是其他节点的依赖
        d.isDependency = false;
        return d;
      });
      // 最后返回网络和服务的节点
      return this.volumes.concat(dependingDeployementsNodes);
    },
  },
  watch: {
    rawData(rawData) {
      this.yaml = rawData;
    }
  }
}
</script>

<style lang="scss">
@import './compose-topo.scss';
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
ul {
  list-style: none;
}
</style>
