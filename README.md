# ek-search-plugin

Search plugin from Origo's search control. Made to fit our search backend better (and added customizability).

**Exempel:**
```HTML
<script type="text/javascript">
    var origo = Origo('index.json');
    origo.on('load', function (viewer) {
      var search = eksearch({
          url: "http://localhost:3000/test",
          maxZoomLevel: 11,
          idAttribute: "id",
          layerNameAttribute: "layername",
          titleAttribute: "layername",
          contentAttribute: "title",
          type: "postgis",
          estatePartConfig: {
            estatePartLayerName: "estates_partials",
            estateLayerName: "estates"
          }
        });
      viewer.addComponent(search);
    });
</script>
```
`estatePartConfig` is optional and is used to be able to search for estate partials "skiften" and click such search hits and then have the map panzoom to said partial but select and show info for the whole estate. It is meant for two suitable estate (polygon) layers. 