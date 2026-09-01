import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

window.L = L;

function EditControl({ position = 'topright', onCreated, onEdited, onDeleted, draw, featureGroup }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !L.Draw || !featureGroup) return undefined;

    const options = {
      position,
      edit: {
        featureGroup: featureGroup,
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
  }, [draw, featureGroup, map, onCreated, onDeleted, onEdited, position]);

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
  const [mapCenter] = useState(center);
  const [featureGroup, setFeatureGroup] = useState(null);

  const handleCreated = (e) => {
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      const latLngs = layer.getLatLngs()[0];
      const newCoords = latLngs.map(latlng => ({ lat: latlng.lat, lng: latlng.lng }));
      onCoordinatesChange(newCoords);
      
      // We rely on React to render the Polygon component when state updates.
      // If leaflet-draw attached any temporary layers to the feature group, we clear them.
      if (featureGroup && featureGroup.hasLayer(layer)) {
        featureGroup.removeLayer(layer);
      }
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

  useEffect(() => {
    // When coordinates are empty, ensure we clear any orphan layers in the feature group.
    // The declarative <Polygon> will handle rendering when coordinates are present.
    if (featureGroup && (!coordinates || coordinates.length === 0)) {
       featureGroup.clearLayers();
    }
  }, [coordinates, featureGroup]);

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', zIndex: 0 }}>
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup ref={setFeatureGroup}>
          <EditControl
            featureGroup={featureGroup}
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
          {coordinates && coordinates.length > 0 && (
            <Polygon positions={coordinates} color="#f06548" />
          )}
        </FeatureGroup>
        <MapEffect coordinates={coordinates} />
      </MapContainer>
    </div>
  );
}
