<template>
  <div v-if="trackList.length" class="track-list-container">
    <h4 class="track-list-heading">
      曲目列表
    </h4>
    <table class="table table-striped track-table">
      <thead>
        <tr>
          <th>#</th>
          <th>曲目名称</th>
          <th>艺术家</th>
          <th>编曲</th>
          <th>演唱</th>
          <th>作词</th>
          <th>表演</th>
          <th>原曲</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="track in trackList" :key="track.id">
          <td>{{ track.trackno }}</td>
          <td>{{ track.name }}</td>
          <td>{{ track.artist }}</td>
          <td>{{ track.arrange }}</td>
          <td>{{ track.vocal }}</td>
          <td>{{ track.lyric }}</td>
          <td>{{ track.perform }}</td>
          <td>{{ track.ogmusic }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="no-tracks">
    <p>未在thwiki.cc搜索到专辑信息</p>
  </div>
</template>

  <script lang="ts">
  import { defineComponent } from 'vue'

  export default defineComponent({
    props: {
      trackList: { type: Array, required: true }
    }
  })
  </script>

  <style scoped>
  .track-list-container {
    margin-top: 20px;
  }

  .track-list-heading {
    font-size: 1.5em;
    margin-bottom: 10px;
  }

  .track-table {
    width: 100%;
    border-collapse: collapse;
  }

  .track-table th, .track-table td {
    padding: 10px;
    text-align: left;
  }

  .track-table thead {
    background-color: #f8f9fa;
  }

  .no-tracks {
    margin-top: 20px;
    text-align: center;
    color: #6c757d;
  }
  </style>
