<template>
  <div>
    <ul class="nav-underlined mb-3">
      <li v-for="{ value, text } in options" :key="value">
        <router-link :to="{... $route, params: {... $route.params, sort: value }}">
          {{ text }}
        </router-link>
      </li>
    </ul>
    <AlbumList :items="albums" />
    <InfiniteLoader :key="sort" :loading="loading" :has-more="hasMore" @load-more="loadMore" />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import AlbumList from './AlbumList.vue'
  import { Album, AlbumSort } from '@/shared/api'

  export default defineComponent({
    components: {
      AlbumList,
    },
    props: {
      sort: { type: String, required: true },
    },
    data() {
      return {
        albums: [] as | Album[],
        loading: false,
        offset: 0 as number,
        hasMore: true,
      }
    },
    computed: {
      options() {
        return [
          { text: '最近添加', value: 'recently-added' },
          { text: '最近播放', value: 'recently-played' },
          { text: '最多播放', value: 'most-played' },
          { text: 'A-Z排序', value: 'a-z' },
          { text: '随机专辑', value: 'random' },
        ]
      }
    },
    watch: {
      sort: {
        handler() {
          this.albums = []
          this.offset = 0
          this.hasMore = true
        }
      }
    },
    methods: {
      loadMore() {
        this.loading = true
        return this.$api.getAlbums(this.sort as AlbumSort, 50, this.offset).then(albums => {
          this.albums.push(...albums)
          this.offset += albums.length
          this.hasMore = albums.length > 0
          this.loading = false
        })
      }
    }
  })
</script>
