import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import type { NearbyPost, UserLocation } from "../../lib/location";
import { formatDistance, formatLocationLabel, milesToMeters } from "../../lib/location";
import "leaflet/dist/leaflet.css";

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#3DD9C8;border:2px solid #fff;box-shadow:0 0 8px rgba(61,217,200,0.8)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const postIcon = L.divIcon({
  className: "",
  html: `<div style="width:10px;height:10px;border-radius:50%;background:#5BC77A;border:2px solid #fff;box-shadow:0 0 6px rgba(91,199,122,0.6)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
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

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/70 shadow-[var(--dash-card-shadow)]">
      <div className="dash-badge absolute top-3 right-3 z-[400] px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
        {worldwide ? "Worldwide view" : formatLocationLabel(userLocation)}
      </div>
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={false}
        className="h-[340px] w-full z-0 [&_.leaflet-top.leaflet-left]:z-[500]"
        style={{ background: "#C5EBFA" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                color: "#3DD9C8",
                fillColor: "#5BC77A",
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: "6 4",
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
              <div className="text-sm">
                <p className="font-semibold">{post.title}</p>
                <p className="text-xs opacity-70">
                  {formatDistance(post.distanceMiles)} · {post.hours_cost}h
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
