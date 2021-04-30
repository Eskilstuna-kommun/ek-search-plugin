# ek-search-plugin

Ändringar till Origos sökfunktion utlyft som egen plugin.

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
          type: "postgis"
        });
      viewer.addComponent(search);
    });
</script>
```
