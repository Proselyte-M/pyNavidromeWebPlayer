<template>
  <section v-if="externalAlbumInfo" class="external-info">
    <h3 class="info-heading">
      来自THWiki的更多信息
    </h3>
    <div v-if="externalAlbumInfo.coverurl" class="album-details">
      <div class="album-cover">
        <a :href="externalAlbumInfo.coverurl" target="_blank" rel="noopener noreferrer">
          <img :src="externalAlbumInfo.coverurl" alt="专辑封面" class="cover-image">
        </a>
      </div>
      <div class="album-info">
        <p v-if="externalAlbumInfo.alname">
          <strong>专辑名称:</strong> {{ externalAlbumInfo.alname }}
        </p>
        <p v-if="externalAlbumInfo.circle">
          <strong>社团名称:</strong> {{ externalAlbumInfo.circle }}
        </p>
        <p v-if="externalAlbumInfo.event">
          <strong>发布展会:</strong> {{ externalAlbumInfo.event }}
        </p>
        <p v-if="externalAlbumInfo.date">
          <strong>发布日期:</strong> {{ externalAlbumInfo.date }}
        </p>
        <p v-if="externalAlbumInfo.coverchar">
          <strong>封面角色:</strong> {{ externalAlbumInfo.coverchar }}
        </p>
      </div>
    </div>
  </section>
</template>
/* eslint-disable */
  <script lang="ts">
  import { defineComponent } from 'vue'

  export default defineComponent({
    props: {
      externalAlbumInfo: { type: Object, required: true }
    }
  })
  </script>

  <style scoped>
  .external-info {
    margin-top: 20px;
  }

  .info-heading {
    font-size: 1.5em;
    margin-bottom: 10px;
  }

  .album-details {
    display: flex;
    align-items: flex-start;
  }

  .album-cover {
    flex-shrink: 0;
  }

  .cover-image {
    width: 300px;
    height: auto;
  }

  .album-info {
    margin-left: 20px;
  }

  @media (max-width: 600px) {
    .album-details {
      flex-direction: column;
      align-items: center;
    }

    .album-info {
      margin-left: 0;
      margin-top: 10px;
    }

    .cover-image {
      width: 100%;
      max-width: 300px;
    }
  }
  </style>
