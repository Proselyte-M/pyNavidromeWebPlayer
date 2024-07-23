<template>
      <el-container style="height: 100vh;">
        <el-aside width="200px">
          <AsideMenu />
        </el-aside>
        <el-container>
          <el-header>
            <MusicPlayer />
          </el-header>
          <el-main>
            <MainPage />
          </el-main>
          <el-footer>Footer</el-footer>
        </el-container>
      </el-container>
  </template>
  
  <script>
  import AsideMenu from './AsideMenu.vue';
  import MusicPlayer from './MusicPlayer.vue';
  import MainPage from './MainPage.vue';
  
  export default {
    name: 'MyLayout',
    components: {
      AsideMenu,
      MusicPlayer,
      MainPage
    }
  }
  </script>
  
  <style>
  html, body {
    height: 100%;
    margin: 0;
  }
  
  #app {
    height: 100%;
  }
  
  