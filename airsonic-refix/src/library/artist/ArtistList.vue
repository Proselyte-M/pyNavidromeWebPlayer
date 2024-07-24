<template functional>
  <Tiles>
    <Tile v-for="item in props.items" :key="item.id"
          :to="{name: 'artist', params: { id: item.id } }"
          :title="item.name" :image="item.image">
      <template #text>
        <strong>{{ item.albumCount }}</strong> 专辑
      </template>
    </Tile>
  </Tiles>
</template>
