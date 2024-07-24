<template>
  <nav class="nav flex-column">
    <div class="sidebar-brand d-flex justify-content-between align-items-end">
      <Logo />
      <button class="btn btn-link btn-lg p-0 m-0 d-md-none" @click="store.hideMenu">
        <Icon icon="x" />
      </button>
    </div>

    <router-link class="nav-link" :to="{name: 'home'}" exact>
      <Icon icon="discover" class="" /> 探索
    </router-link>

    <router-link class="nav-link" :to="{name: 'queue'}">
      <Icon icon="playlist" /> 播放列表
    </router-link>

    <small class="sidebar-heading text-muted">
      音乐库
    </small>

    <router-link class="nav-link" :to="{name: 'albums-default'}">
      <Icon icon="library" /> 专辑列表
    </router-link>

    <router-link class="nav-link" :to="{name: 'artists'}">
      <Icon icon="library" /> 社团列表
    </router-link>
<!--
    <router-link class="nav-item nav-link" :to="{name: 'genres'}">
      <Icon icon="library" /> 风格列表
    </router-link>
-->

    <router-link class="nav-link" :to="{name: 'playlists'}">
      <Icon icon="list" /> 歌单列表
    </router-link>
<!--
    <router-link class="nav-link" :to="{name: 'favourites'}">
      <Icon icon="heart" /> 收藏歌曲
    </router-link>

    <router-link class="nav-link" :to="{name: 'podcasts'}">
      <Icon icon="podcast" /> Podcasts
    </router-link>

    <router-link class="nav-link" :to="{name: 'radio'}">
      <Icon icon="radio" /> Radio
    </router-link>

    <router-link class="nav-link" :to="{name: 'files'}">
      <Icon icon="files" /> Files
    </router-link>
-->
    <PlaylistNav />
  </nav>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import Logo from './Logo.vue'
  import PlaylistNav from '@/library/playlist/PlaylistNav.vue'
  import { useMainStore } from '@/shared/store'

  export default defineComponent({
    components: {
      Logo,
      PlaylistNav,
    },
    setup() {
      return {
        store: useMainStore(),
      }
    },
  })
</script>
