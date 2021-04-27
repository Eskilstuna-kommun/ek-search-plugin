import Origo from 'Origo';
import GeoJSONFormat from 'ol/format/GeoJSON';
import MultiPoint from 'ol/geom/MultiPoint';
import MultiLineString from 'ol/geom/MultiLineString';
import Awesomplete from 'awesomplete';
import generateUUID from './utils/generateuuid';
import checkExistingSelection from './utils/checkselection';
import getCenter from './utils/getcenter';

const eksearch = function eksearch(options = {}) {
  const keyCodes = {
    9: 'tab',
    27: 'esc',
    37: 'left',
    39: 'right',
    13: 'enter',
    38: 'up',
    40: 'down'
  };

  let {
    name,
    northing,
    easting,
    layerNameAttribute,
    layerName,
    title,
    titleAttribute,
    contentAttribute,
    includeSearchableLayers,
    searchableDefault,
    maxZoomLevel,
    limit,
    hintText,
    minLength
  } = options;

  const {
    idAttribute,
    url
  } = options;

  let searchDb = {};
  let map;
  let awesomplete;
  let viewer;
  let searchButton;
  let closeButton;
  let containerElement;
  let wrapperElement;
  let selectionManager;
  let featureInfo;
  const dom = Origo.ui.dom;

  function showFeatureInfo(features, layer, ftl) {
    const feature = features[0];
    feature.set('textHtml', ftl);
    layer.set('attributes', 'textHtml');

    const item = new Origo.SelectedItem(feature, layer, map, layer.get('name'), layer.get('title'));
    const isOverlay = viewer.getViewerOptions().featureinfoOptions.infowindow === 'overlay';

    if (isOverlay) {
      const obj = {};
      obj.feature = feature;
      obj.title = layer.get('title');
      obj.content = `<div class="o-identify-content">${ftl}</div>`;
      featureInfo.render([obj], 'overlay', getCenter(feature.getGeometry()));
    } else if (checkExistingSelection(item, selectionManager)) {
      selectionManager.addOrHighlightItem(item);
    }
    viewer.zoomToExtent(feature.getGeometry(), maxZoomLevel);
  }

  async function getFeatureInfoWMS(source, layer, proj, id) {
    const sourceUrl = `${source[layer.get('sourceName')].url.replace('wms', 'wfs')}?`;
    const geometryName = layer.get('geometryName');
    const queryAttribute = layer.get('queryAttribute') || 'sokid';
    const format = new GeoJSONFormat({
      geometryName
    });

    const QueryString = encodeURI(['service=WFS',
      '&version=1.1.0',
      `&request=GetFeature&typeNames=${layer.get('name')}`,
      '&outputFormat=json',
      `&filter=<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"><ogc:PropertyIsEqualTo><ogc:PropertyName>${queryAttribute}</ogc:PropertyName><ogc:Literal>${id}</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>`
    ].join(''));

    const response = await fetch(sourceUrl + QueryString).then(res => res.json());

    const features = format.readFeatures(response);
    if (features.length > 0) {
      const coord = features[0].getGeometry().getFirstCoordinate();
      const featureType = features[0].getGeometry();
      let resolution;

      if (featureType instanceof MultiPoint) resolution = 0.28;
      if (featureType instanceof MultiLineString) resolution = 14.0;

      if (!resolution) resolution = 2.8;

      let FeatureInfoUrl = layer.getSource().getFeatureInfoUrl(coord, resolution, proj, {
        INFO_FORMAT: 'text/html',
        feature_count: 1,
        buffer: 1
      });

      FeatureInfoUrl += encodeURI(`&filter=<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"><ogc:PropertyIsEqualTo><ogc:PropertyName>${queryAttribute}</ogc:PropertyName><ogc:Literal>${id}</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>`);

      fetch(FeatureInfoUrl)
        .then(res => res.text())
        .then((ftl) => {
          showFeatureInfo(features, layer, ftl);
        });
    }
  }

  function selectHandler(evt) {
    let id = evt.text.label;
    const data = searchDb[id];
    let layer;

    if (layerNameAttribute && idAttribute) {
      const source = viewer.getMapSource();
      const proj = viewer.getProjection();

      layer = viewer.getLayer(data[layerNameAttribute]);
      id = data[idAttribute];
      getFeatureInfoWMS(source, layer, proj, id);
    } else {
      console.log('Search options are missing');
    }
  }

  function setSearchDb(data) {
    data.forEach((item) => {
      const dataItem = item;
      const id = generateUUID();
      dataItem.label = id;
      dataItem.value = item[name];
      searchDb[id] = dataItem;
    });
  }

  function clearSearchResults() {
    awesomplete.list = [];
    setSearchDb([]);
  }

  function onClearSearch() {
    document.getElementById(`${closeButton.getId()}`).addEventListener('click', () => {
      clearSearchResults();
      document.getElementById(`${containerElement.getId()}`).classList.remove('o-search-true');
      document.getElementById(`${containerElement.getId()}`).classList.add('o-search-false');
      document.getElementsByClassName('o-search-field')[0].value = '';
      document.getElementById(`${searchButton.getId()}`).blur();
    });
  }

  function bindUIActions() {
    document.getElementById('hjl').addEventListener('awesomplete-selectcomplete', selectHandler);
    document.getElementById('hjl').addEventListener('awesomplete-open', () => viewer.dispatch('search:open'));

    document.getElementsByClassName('o-search-field')[0].addEventListener('input', () => {
      if (document.getElementsByClassName('o-search-field')[0].value && document.getElementById(`${containerElement.getId()}`).classList.contains('o-search-false')) {
        document.getElementById(`${containerElement.getId()}`).classList.remove('o-search-false');
        document.getElementById(`${containerElement.getId()}`).classList.add('o-search-true');
        onClearSearch();
      } else if (!(document.getElementsByClassName('o-search-field')[0].value) && document.getElementById(`${containerElement.getId()}`).classList.contains('o-search-true')) {
        document.getElementById(`${containerElement.getId()}`).classList.remove('o-search-true');
        document.getElementById(`${containerElement.getId()}`).classList.add('o-search-false');
      }
    });

    document.getElementsByClassName('o-search-field')[0].addEventListener('blur', () => {
      document.getElementById(`${wrapperElement.getId()}`).classList.remove('active');
      window.dispatchEvent(new Event('resize'));
    });
    document.getElementsByClassName('o-search-field')[0].addEventListener('focus', () => {
      document.getElementById(`${wrapperElement.getId()}`).classList.add('active');
      window.dispatchEvent(new Event('resize'));
    });
  }

  function renderList(suggestion, input) {
    const item = searchDb[suggestion.label] || {};
    const header = 'header' in item ? `<div class="heading">${item.header}</div>` : '';
    let opts = {};
    let html = input === '' ? suggestion.value : suggestion.value.replace(RegExp(Awesomplete.$.regExpEscape(input), 'gi'), '<mark>$&</mark>');
    html = `${header}<div class="suggestion">${html}</div>`;
    opts = {
      innerHTML: html,
      'aria-selected': 'false'
    };
    if ('header' in item) {
      opts.className = 'header';
    }

    return Awesomplete.$.create('li', opts);
  }

  function dbToList() {
    const items = Object.keys(searchDb);
    return items.map(item => searchDb[item]);
  }

  function groupDb(data) {
    const group = {};
    const ids = Object.keys(data);
    ids.forEach((id) => {
      const item = data[id];
      const type = item[layerNameAttribute];
      if (!viewer.getLayer(type)) return;
      if (type in group === false) {
        group[type] = [];
        item.header = viewer.getLayer(type).get('title');
      }
      group[type].push(item);
    });
    return group;
  }

  function groupToList(group) {
    const types = Object.keys(group);
    let list = [];
    const selection = {};
    let nr = 0;
    let turn = 0;

    const groupList = () => {
      types.slice().forEach((type) => {
        for (let i = 0; i < 3; i += 1) {
          if (nr < limit) {
            const item = group[type][turn + i];
            if (type in selection === false) {
              selection[type] = [];
            }
            selection[type][turn + i] = item;
            if (!group[type][turn + i + 1]) {
              types.splice(types.indexOf(type), 1);
              break;
            }
          }
          nr += 1;
        }
      });
      turn += 3;
    };

    while (nr < limit && types.length) {
      groupList();
    }
    list = Object.keys(selection).reduce((previous, currentGroup) => previous.concat(selection[currentGroup]), []);
    return list;
  }

  // /*
  // The label property in Awesomplete is used to store the feature id. This way the properties
  // of each feature in the search response will be available in event handling.
  // The complete properties are stored in a tempory db called searchDb. This is a workaround
  // for a limit in Awesomplete that can only store data in the fields label and text.
  // The data-category attribute is used to make a layer division in the sugguestion list.
  // */

  function initAutocomplete() {
    let list;
    const input = document.getElementsByClassName('o-search-field')[0];

    awesomplete = new Awesomplete('.o-search-field', {
      minChars: minLength,
      autoFirst: false,
      sort: false,
      maxItems: limit,
      item: renderList,
      filter(suggestion) {
        return suggestion.value;
      }
    });

    const handler = function func(data) {
      list = [];
      searchDb = {};
      if (data.length) {
        setSearchDb(data);
        if (name && layerNameAttribute) {
          list = groupToList(groupDb(searchDb));
        } else {
          list = dbToList(data);
        }
        awesomplete.list = list;
        awesomplete.evaluate();
      }
    };

    // Change data structure to match awesomeplete
    function parseData(data) {
      const arr = [];
      data.forEach((hits) => {
        hits.hits.forEach((obj) => {
          arr.push({
            id: obj.id,
            layername: hits.layername,
            title: obj.title
          });
        });
      });
      return arr;
    }

    function serialize(obj) {
      const str = [];
      Object.entries(obj).forEach((key) => {
        str.push(`${encodeURIComponent(key[0])}=${encodeURIComponent(key[1])}`);
      });
      return str.join('&');
    }

    function makeRequest(reqHandler, obj) {
      if (options.type === 'postgis') {
        const data = {
          searchstring: obj.value,
          layers: viewer.getSearchableLayers().reduce((acc, curr) => `${acc};${curr}`),
          date: new Date().getTime()
        };
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body: serialize(data)
        })
          .then(response => response.json())
          .then((json) => {
            clearSearchResults();
            if (json) { reqHandler(parseData(json)); }
          });
      } else {
        let queryUrl = `${url}?q=${encodeURI(obj.value)}`;
        if (includeSearchableLayers) {
          queryUrl += `&l=${viewer.getSearchableLayers(searchableDefault)}`;
        }
        fetch(queryUrl)
          .then(response => response.json())
          .then(reqHandler);
      }
    }

    input.addEventListener('keyup', (e) => {
      const keyCode = e.keyCode;
      if (input.value.length >= minLength) {
        if (keyCode in keyCodes) {
          // empty
        } else {
          makeRequest(handler, input);
        }
      }
    });
  }

  return Origo.ui.Component({
    name: 'eksearch',
    onAdd(evt) {
      viewer = evt.target;
      selectionManager = viewer.getSelectionManager();
      featureInfo = viewer.getControlByName('featureInfo');
      name = 'title'; // options.searchAttribute;

      if (!northing) northing = undefined;
      if (!easting) easting = undefined;
      if (!layerNameAttribute) layerNameAttribute = undefined;
      if (!layerName) layerName = undefined;
      if (!title) title = '';
      if (!titleAttribute) titleAttribute = undefined;
      if (!contentAttribute) contentAttribute = undefined;
      if (!maxZoomLevel) maxZoomLevel = viewer.getResolutions().length - 2 || viewer.getResolutions();
      if (!limit) limit = 9;
      if (!minLength) minLength = 1;

      includeSearchableLayers = Object.prototype.hasOwnProperty.call(options, 'includeSearchableLayers') ? options.includeSearchableLayers : false;
      searchableDefault = Object.prototype.hasOwnProperty.call(options, 'searchableDefault') ? options.searchableDefault : false;
      map = viewer.getMap();

      this.addComponents([searchButton, closeButton, containerElement, wrapperElement]);
      this.render();
    },
    onInit() {
      if (!hintText) hintText = 'Sök...';
      searchButton = Origo.ui.Button({
        cls: 'o-search-button no-shrink no-grow compact icon-small',
        icon: '#ic_search_24px',
        iconCls: 'grey'
      });

      closeButton = Origo.ui.Button({
        cls: 'o-search-button-close no-shrink no-grow compact icon-small',
        click() {
          onClearSearch();
        },
        icon: '#ic_close_24px',
        iconCls: 'grey'
      });

      containerElement = Origo.ui.Element({
        cls: 'o-search o-search-false flex row align-center padding-right-small',
        innerHTML: `<input id="hjl" class="o-search-field form-control text-grey-darker" type="text" placeholder="${hintText}"></input>`
      });

      wrapperElement = Origo.ui.Element({
        cls: 'o-search-wrapper absolute top-center rounded box-shadow bg-white',
        style: {
          'flex-wrap': 'wrap',
          overflow: 'visible'
        }
      });
    },

    render() {
      const mapEl = document.getElementById(viewer.getMain().getId());

      let htmlString = wrapperElement.render();
      let el = dom.html(htmlString);
      mapEl.appendChild(el);

      htmlString = containerElement.render();
      el = dom.html(htmlString);
      document.getElementById(wrapperElement.getId()).appendChild(el);

      htmlString = searchButton.render();
      el = dom.html(htmlString);
      document.getElementById(containerElement.getId()).appendChild(el);

      htmlString = closeButton.render();
      el = dom.html(htmlString);
      document.getElementById(containerElement.getId()).appendChild(el);

      initAutocomplete();
      bindUIActions();

      this.dispatch('render');
    }
  });
};

export default eksearch;
