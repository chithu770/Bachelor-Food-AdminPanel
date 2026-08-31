import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

window.L = L;

function EditControl({ position = 'topright', onCreated, onEdited, onDeleted, draw, featureGroupRef }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !L.Draw || !featureGroupRef?.current) return undefined;

    const options = {
      position,
      edit: {
        featureGroup: featureGroupRef.current,
        remove: true
      },
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Oh snap!<strong> you can\'t draw that!'
          },
          shapeOptions: {
            color: '#f06548'
          }
        }
      }
    };

    if (draw) {
      options.draw = { ...options.draw, ...draw };
    }

    const control = new L.Control.Draw(options);
    map.addControl(control);

    const createdHandler = (event) => {
      if (onCreated) onCreated(event);
    };
    const editedHandler = (event) => {
      if (onEdited) onEdited(event);
    };
    const deletedHandler = (event) => {
      if (onDeleted) onDeleted(event);
    };

    map.on(L.Draw.Event.CREATED, createdHandler);
    map.on(L.Draw.Event.EDITED, editedHandler);
    map.on(L.Draw.Event.DELETED, deletedHandler);

    return () => {
      map.off(L.Draw.Event.CREATED, createdHandler);
      map.off(L.Draw.Event.EDITED, editedHandler);
      map.off(L.Draw.Event.DELETED, deletedHandler);
      map.removeControl(control);
    };
  }, [draw, featureGroupRef, map, onCreated, onDeleted, onEdited, position]);

  return null;
}

// Fix for default marker icons in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapEffect({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, coordinates]);
  return null;
}

export default function ZoneMap({ coordinates, onCoordinatesChange, center = [23.8103, 90.4125], zoom = 12 }) {
  const [mapCenter, setMapCenter] = useState(center);
  const featureGroupRef = useRef();

  const handleCreated = (e) => {
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      const latLngs = layer.getLatLngs()[0];
      const newCoords = latLngs.map(latlng => ({ lat: latlng.lat, lng: latlng.lng }));
      onCoordinatesChange(newCoords);
      
      // Remove other layers to only keep one polygon
      const fg = featureGroupRef.current;
      fg.eachLayer(l => {
        if (l !== layer) {
          fg.removeLayer(l);
        }
      });
    }
  };

  const handleEdited = (e) => {
    const layers = e.layers;
    layers.eachLayer(layer => {
      const latLngs = layer.getLatLngs()[0];
      const newCoords = latLngs.map(latlng => ({ lat: latlng.lat, lng: latlng.lng }));
      onCoordinatesChange(newCoords);
    });
  };

  const handleDeleted = (e) => {
    onCoordinatesChange([]);
  };

  // We only render Polygon if the drawing tools haven't drawn it yet, 
  // but to keep it simple, if coordinates exist we show them, 
  // but if the user starts drawing, leaflet-draw takes over.
  // When editing an existing zone, we need to load it into the feature group.

  useEffect(() => {
    // When coordinates are loaded from props (e.g. editing a zone),
    // and if there's no layer in featureGroup, we can add a polygon layer manually.
    // However, react-leaflet-draw works best if we just let the <Polygon> render
    // or manually add it to the featureGroup so it's editable.
    if (featureGroupRef.current && coordinates && coordinates.length > 0) {
      const fg = featureGroupRef.current;
      // If feature group is empty, we add the polygon
      if (Object.keys(fg._layers).length === 0) {
         const polygon = L.polygon(coordinates, { color: '#f06548' });
         fg.addLayer(polygon);
      }
    } else if (featureGroupRef.current && (!coordinates || coordinates.length === 0)) {
       const fg = featureGroupRef.current;
       fg.clearLayers();
    }
  }, [coordinates]);

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', zIndex: 0 }}>
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: '#e1e100',
                  message: '<strong>Oh snap!<strong> you can\'t draw that!'
                },
                shapeOptions: {
                  color: '#f06548'
                }
              }
            }}
          />
        </FeatureGroup>
        <MapEffect coordinates={coordinates} />
      </MapContainer>
    </div>
  );
}
