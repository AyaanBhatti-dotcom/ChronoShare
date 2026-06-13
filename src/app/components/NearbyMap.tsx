import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import type { NearbyPost, UserLocation } from "../../lib/location";
import { formatDistance, formatLocationLabel, milesToMeters } from "../../lib/location";
import "leaflet/dist/leaflet.css";

const userIcon = L.divIcon({
  className: "dash-map-marker",
  html: `<div class="dash-map-pin dash-map-pin-user" aria-hidden="true"><span class="dash-map-pin-head"></span><span class="dash-map-pin-stem"></span><span class="dash-map-pin-shine"></span></div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 34],
  popupAnchor: [0, -32],
});

const postIcon = L.divIcon({
  className: "dash-map-marker",
  html: `<div class="dash-map-pin dash-map-pin-post" aria-hidden="true"><span class="dash-map-pin-head"></span><span class="dash-map-pin-stem"></span><span class="dash-map-pin-shine"></span></div>`,
  iconSize: [22, 28],
  iconAnchor: [11, 26],
  popupAnchor: [0, -24],
});

function MapViewport({
  center,
  radiusMiles,
}: {
  center: [number, number];
  radiusMiles: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  useEffect(() => {
    const radiusMeters = milesToMeters(radiusMiles);
    const bounds = L.latLng(center[0], center[1]).toBounds(radiusMeters * 2);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
  }, [center, radiusMiles, map]);

  return null;
}

function MapWorldViewport({
  center,
  posts,
}: {
  center: [number, number];
  posts: NearbyPost[];
}) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngExpression[] = [center];
    for (const post of posts) {
      if (post.latitude != null && post.longitude != null) {
        points.push([post.latitude, post.longitude]);
      }
    }

    if (points.length === 1) {
      map.setView(center, 3);
      return;
    }

    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 8 });
  }, [center, posts, map]);

  return null;
}

interface NearbyMapProps {
  userLocation: UserLocation;
  posts: NearbyPost[];
  radiusMiles: number;
  worldwide?: boolean;
  onSelectPost?: (post: NearbyPost) => void;
}

export function NearbyMap({
  userLocation,
  posts,
  radiusMiles,
  worldwide = false,
  onSelectPost,
}: NearbyMapProps) {
  const center: [number, number] = [userLocation.latitude, userLocation.longitude];
  const mapPosts = posts.filter(
    (post) => post.latitude != null && post.longitude != null,
  );
  const locationLabel = worldwide ? "Worldwide view" : formatLocationLabel(userLocation);

  return (
    <div className="dash-map-win7">
      <div className="dash-map-win7-titlebar">
        <div className="dash-map-win7-title">
          <MapPin size={14} strokeWidth={2.5} />
          <span>ChronoShare Maps</span>
          <span className="dash-map-win7-subtitle">— {locationLabel}</span>
        </div>
        <div className="dash-map-win7-controls" aria-hidden="true">
          <span className="dash-map-win7-btn dash-map-win7-btn-min" />
          <span className="dash-map-win7-btn dash-map-win7-btn-max" />
          <span className="dash-map-win7-btn dash-map-win7-btn-close" />
        </div>
      </div>

      <div className="dash-map-win7-body">
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={false}
          zoomControl={false}
          className="dash-map-leaflet h-[340px] w-full z-0"
          style={{ background: "#a8d4f0" }}
        >
          <ZoomControl position="topleft" />
          <TileLayer
            attribution='&copy; OpenStreetMap &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {worldwide ? (
            <MapWorldViewport center={center} posts={mapPosts} />
          ) : (
            <>
              <MapViewport center={center} radiusMiles={radiusMiles} />
              <Circle
                center={center}
                radius={milesToMeters(radiusMiles)}
                pathOptions={{
                  color: "#3399ff",
                  fillColor: "#6ec6e8",
                  fillOpacity: 0.22,
                  weight: 2.5,
                  dashArray: "8 6",
                }}
              />
            </>
          )}
          <Marker position={center} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
          {mapPosts.map((post) => (
            <Marker
              key={post.id}
              position={[post.latitude!, post.longitude!]}
              icon={postIcon}
              eventHandlers={{
                click: () => onSelectPost?.(post),
              }}
            >
              <Popup>
                <div className="dash-map-popup">
                  <p className="dash-map-popup-title">{post.title}</p>
                  <p className="dash-map-popup-meta">
                    {formatDistance(post.distanceMiles)} · {post.hours_cost}h
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="dash-map-win7-statusbar">
        <span>{mapPosts.length} listing{mapPosts.length === 1 ? "" : "s"} on map</span>
        <span>© OpenStreetMap · CARTO</span>
      </div>
    </div>
  );
}
