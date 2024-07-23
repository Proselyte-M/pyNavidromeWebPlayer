<template>
    <div class="aside-menu">
        <div class="title">
            <h1>东方音乐播放站</h1>
        </div>
      <ul>
        <li v-for="(item, index) in menuItems" :key="index">{{ item }}</li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AsideMenu',
    data() {
      return {
        menuItems: [
          'Option 1',
          'Option 2',
          'Option 3',
          'Option 4'
        ]
      };
    }
  }
  </script>
  
  <style scoped>
  .aside-menu {
    padding: 20px;
  }
  
  .aside-menu ul {
    list-style-type: none;
    padding: 0;
  }
  
  .aside-menu li {
  height: 40px; /* 设置Option按钮的高度 */
  display: flex;
  align-items: center; /* 垂直居中 */
}
  
  .aside-menu li:hover {
    background-color: #E9EEF3;
  }
  </style>
  