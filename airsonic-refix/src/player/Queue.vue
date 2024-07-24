<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h1 class="mb-0">
        正在播放中
      </h1>
      <div>
        <b-button variant="link" class="mr-2" @click="shuffle">
          <Icon icon="shuffle" /> 随机播放
        </b-button>
        <b-button variant="link" @click="clear">
          <Icon icon="x" /> 清空列表
        </b-button>
      </div>
    </div>
    <BaseTable v-if="tracks.length > 0">
      <BaseTableHead>
        <th class="text-left d-none d-lg-table-cell">
          艺术家
        </th>
        <th class="text-left d-none d-md-table-cell">
          专辑
        </th>
        <th class="text-right d-none d-md-table-cell">
          年份
        </th>
      </BaseTableHead>
      <tbody>
        <tr v-for="(item, index) in tracks" :key="index"
            :class="{'active': index === queueIndex}"
            :draggable="true" @dragstart="dragstart(item.id, $event)"
            @click="play(index)">
          <CellTrackNumber :active="index === queueIndex && isPlaying" :value="item.track" />
          <CellTitle :track="item" />
          <CellArtist :track="item" />
          <CellAlbum :track="item" />
          <CellDuration :track="item" />
          <CellActions :track="item">
            <b-dropdown-divider />
            <ContextMenuItem icon="x" variant="danger" @click="remove(index)">
              移除
            </ContextMenuItem>
          </CellActions>
        </tr>
      </tbody>
    </BaseTable>
    <EmptyIndicator v-else />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import BaseTable from '@/library/track/BaseTable.vue'
  import BaseTableHead from '@/library/track/BaseTableHead.vue'
  import CellTrackNumber from '@/library/track/CellTrackNumber.vue'
  import CellDuration from '@/library/track/CellDuration.vue'
  import CellAlbum from '@/library/track/CellAlbum.vue'
  import CellArtist from '@/library/track/CellArtist.vue'
  import CellTitle from '@/library/track/CellTitle.vue'
  import CellActions from '@/library/track/CellActions.vue'

  export default defineComponent({
    components: {
      CellActions,
      CellTitle,
      CellArtist,
      CellAlbum,
      CellDuration,
      CellTrackNumber,
      BaseTableHead,
      BaseTable,
    },
    computed: {
      isPlaying() {
        return this.$store.getters['player/isPlaying']
      },
      tracks() {
        return this.$store.state.player.queue
      },
      queueIndex() {
        return this.$store.state.player.queueIndex
      },
    },
    methods: {
      play(index: number) {
        if (index === this.queueIndex) {
          return this.$store.dispatch('player/playPause')
        }
        return this.$store.dispatch('player/playTrackListIndex', { index })
      },
      dragstart(id: string, event: any) {
        event.dataTransfer.setData('application/x-track-id', id)
      },
      remove(idx: number) {
        return this.$store.commit('player/removeFromQueue', idx)
      },
      clear() {
        return this.$store.commit('player/clearQueue')
      },
      shuffle() {
        return this.$store.commit('player/shuffleQueue')
      }
    }
  })
</script>
