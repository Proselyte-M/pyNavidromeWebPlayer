<template>
  <div v-if="album">
    <Hero :image="album.image">
      <h1>
        {{ album.name }}
      </h1>
      <p>
        by
        <template v-for="(artist, index) in album.artists">
          <span v-if="index > 0" :key="artist.id" class="text-muted">, </span>
          <router-link :key="`${artist.id}-link`" :to="{ name: 'artist', params: { id: artist.id } }">
            {{ artist.name }}
          </router-link>
        </template>
        <span v-if="album.year"> • {{ album.year }}</span>
        <span v-if="album.genres.length"> •
          <template v-for="({ name: genre }, index) in album.genres">
            <span v-if="index > 0" :key="genre" class="text-muted">, </span>
            <router-link :key="`${genre}-link`" :to="{ name: 'genre', params: { id: genre } }">{{ genre }}</router-link>
          </template>
        </span>
      </p>
      <div class="text-nowrap">
        <!-- 播放按钮逻辑 -->
      </div>
      <div class="text-nowrap">
        <b-button variant="secondary" class="mr-2" @click="playNow">
          <Icon icon="play" /> 播放
        </b-button>
        <b-button variant="secondary" class="mr-2" @click="shuffleNow">
          <Icon icon="shuffle" /> 随机播放
        </b-button>
        <OverflowMenu class="px-1">
          <ContextMenuItem icon="plus" @click="setNextInQueue">
            插入列表下一首
          </ContextMenuItem>
          <ContextMenuItem icon="plus" @click="addToQueue">
            插入列表末端
          </ContextMenuItem>
        </OverflowMenu>
      </div>
    </Hero>
    <div class="row">
      <div class="col">
        <TrackList :tracks="album.tracks" no-album />
      </div>
    </div>
    <WikiAlbumInfo :external-album-info="externalAlbumInfo" />
    <WikiTrackList :track-list="trackList" />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import TrackList from '@/library/track/TrackList.vue'
  import { Album } from '@/shared/api'
  import { useFavouriteStore } from '@/library/favourite/store'
  import axios from 'axios'
  import stringSimilarity from 'string-similarity'
  import WikiAlbumInfo from './WikiAlbumInfo.vue'
  import WikiTrackList from './WikiTrackList.vue'

  export default defineComponent({
    components: {
      TrackList,
      WikiAlbumInfo,
      WikiTrackList,
    },
    props: {
      id: { type: String, required: true }
    },
    setup() {
      return {
        favouriteStore: useFavouriteStore()
      }
    },
    data() {
      return {
        album: null as null | Album,
        externalAlbumInfo: null as any, // 用于保存从THWiki获取的信息
        trackList: [] as Array<any> // 用于保存曲目信息
      }
    },
    computed: {
      isFavourite(): boolean {
        return !!this.favouriteStore.albums[this.id]
      },
    },
    async created() {
      this.album = await this.$api.getAlbumDetails(this.id)
      // 如果 album 存在，继续请求THWiki的信息
      if (this.album) {
        await this.fetchTHWikiAlbumInfo(this.album.name)
      }
    },
    methods: {
      async fetchTHWikiAlbumInfo(albumName: string) {
        const searchParams = {
          m: '0',
          g: '2',
          o: '1',
          d: 'nm',
          l: '10',
          v: albumName
        }

        try {
          const searchResponse = await axios.get('https://thwiki.cc/album.php', { params: searchParams })

          if (searchResponse.data) {
            let jsonData: any[] = searchResponse.data

            if (typeof jsonData === 'string') {
              try {
                jsonData = JSON.parse(jsonData)
              } catch (parseError) {
                console.error('Error parsing JSON data:', parseError)
                return
              }
            }

            const albumId = jsonData[0]?.[0]
            if (albumId) {
              await this.fetchAlbumDetails(albumId)
            } else {
              console.warn('No album ID found from THWiki search.')
            }
          }
        } catch (error) {
          console.error('Error fetching album ID from THWiki:', error)
        }
      },

      async fetchAlbumDetails(albumId: string) {
        const detailParams = {
          m: '2',
          g: '2',
          o: '1',
          d: 'kv',
          s: '／',
          f: 'alname+circle+event+date+official+coverurl+coverchar',
          p: 'name+discno+trackno+time+artist+arrange+vocal+compose+dub+lyric+script+perform+ogmusic',
          a: albumId
        }
        try {
          const detailResponse = await axios.get('https://thwiki.cc/album.php', { params: detailParams })
          if (detailResponse.data && Array.isArray(detailResponse.data)) {
            const [albumInfo, ...tracks] = detailResponse.data as any[]
            this.externalAlbumInfo = albumInfo
            this.trackList = Object.values(tracks[0] || {})
          }
        } catch (error) {
          console.error('Error fetching album details from THWiki:', error)
        }
      },

      playNow() {
        return this.$store.dispatch('player/playNow', {
          tracks: this.album!.tracks,
        })
      },
      shuffleNow() {
        return this.$store.dispatch('player/shuffleNow', {
          tracks: this.album!.tracks,
        })
      },
      setNextInQueue() {
        if (this.album) {
          return this.$store.dispatch('player/setNextInQueue', this.album.tracks)
        }
      },
      addToQueue() {
        if (this.album) {
          return this.$store.dispatch('player/addToQueue', this.album.tracks)
        }
      },
      toggleFavourite() {
        return this.favouriteStore.toggle('album', this.id)
      },
    }
  })
</script>
