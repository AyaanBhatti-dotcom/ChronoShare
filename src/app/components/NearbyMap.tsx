import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import { Clock, MapPin, X } from "lucide-react";
import { getInitials } from "../context/AuthContext";
import type { NearbyPost, UserLocation } from "../../lib/location";
import { formatDistance, formatLocationLabel, formatPostLocation, milesToMeters } from "../../lib/location";
import { formatExchangeFormat } from "../../lib/exchange-format";
import "leaflet/dist/leaflet.css";

const userIcon = L.divIcon({
  className: "dash-map-marker",
  html: `<div class="dash-map-pin dash-map-pin-user" aria-hidden="true"><span class="dash-map-pin-head"></span><span class="dash-map-pin-stem"></span><span class="dash-map-pin-shine"></span></div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 34],
  popupAnchor: [0, -32],
});

const postIconCache = new Map<string, L.DivIcon>();

function postIconForType(postType: "needs" | "offers"): L.DivIcon {
  const cached = postIconCache.get(postType);
  if (cached) return cached;

  const typeClass = postType === "needs" ? "dash-map-pin-needs" : "dash-map-pin-offers";
  const icon = L.divIcon({
    className: "dash-map-marker",
    html: `<div class="dash-map-pin dash-map-pin-post ${typeClass}" aria-hidden="true"><span class="dash-map-pin-head"></span><span class="dash-map-pin-stem"></span><span class="dash-map-pin-shine"></span></div>`,
    iconSize: [22, 28],
    iconAnchor: [11, 26],
    popupAnchor: [0, -24],
  });
  postIconCache.set(postType, icon);
  return icon;
}

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
  includeUserCenter,
  frozen = false,
}: {
  center: [number, number];
  posts: NearbyPost[];
  includeUserCenter: boolean;
  frozen?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (frozen) return;

    const points: L.LatLngExpression[] = includeUserCenter ? [center] : [];
    for (const post of posts) {
      if (post.latitude != null && post.longitude != null) {
        points.push([post.latitude, post.longitude]);
      }
    }

    if (points.length === 0) {
      map.setView([20, 0], 2);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0] as [number, number], includeUserCenter ? 3 : 6);
      return;
    }

    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 8 });
  }, [center, posts, includeUserCenter, map, frozen]);

  return null;
}

function MapFocusPost({ post }: { post: NearbyPost | null | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (post?.latitude == null || post.longitude == null) return;
    map.flyTo([post.latitude, post.longitude], Math.max(map.getZoom(), 6), { duration: 0.6 });
  }, [post?.id, post?.latitude, post?.longitude, map]);

  return null;
}

function postTypeLabel(postType: "needs" | "offers"): string {
  return postType === "needs" ? "Needs help" : "Offering skill";
}

function MapPopupContent({
  post,
  worldwide,
  onSelectPost,
}: {
  post: NearbyPost;
  worldwide: boolean;
  onSelectPost?: (post: NearbyPost) => void;
}) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const authorName = post.profiles?.full_name ?? "Community member";
  const isNeeds = post.post_type === "needs";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
    const popupContent = el.closest(".leaflet-popup-content");
    if (popupContent instanceof HTMLElement) {
      L.DomEvent.disableClickPropagation(popupContent);
      L.DomEvent.disableScrollPropagation(popupContent);
    }
  }, []);

  const openDetails = () => {
    map.closePopup();
    onSelectPost?.(post);
  };

  const stopMapEvent = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div ref={containerRef} className="dash-map-popup">
      <span
        className={`dash-map-type-pill ${isNeeds ? "dash-map-type-pill-needs" : "dash-map-type-pill-offers"}`}
      >
        {postTypeLabel(post.post_type)}
      </span>
      <p className="dash-map-popup-author">{authorName}</p>
      <p className="dash-map-popup-title">{post.title}</p>
      {post.description && (
        <p className="dash-map-popup-desc">{post.description}</p>
      )}
      <p className="dash-map-popup-meta">
        {formatPostLocation(post)}
        {!worldwide && post.distanceMiles != null && (
          <> · {formatDistance(post.distanceMiles)}</>
        )}
        {" · "}
        {post.hours_cost}h
      </p>
      <button
        type="button"
        className="dash-map-popup-btn"
        onMouseDown={stopMapEvent}
        onClick={(e) => {
          stopMapEvent(e);
          openDetails();
        }}
      >
        View details
      </button>
    </div>
  );
}

interface MapListingDetailProps {
  post: NearbyPost;
  worldwide: boolean;
  onClose: () => void;
  onOpenBoard?: () => void;
}

function MapListingDetail({ post, worldwide, onClose, onOpenBoard }: MapListingDetailProps) {
  const authorName = post.profiles?.full_name ?? "Community member";
  const isNeeds = post.post_type === "needs";

  return (
    <div className="dash-map-detail">
      <div className="dash-map-detail-header">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="dash-avatar w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {getInitials(authorName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs dash-subtext mb-0.5">{authorName}</p>
            <h4 className="text-sm font-semibold dash-heading leading-snug">{post.title}</h4>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="dash-map-detail-close dash-subtext hover:dash-heading transition-colors flex-shrink-0"
          aria-label="Close listing details"
        >
          <X size={16} />
        </button>
      </div>

      {post.description && (
        <p className="dash-map-detail-desc">{post.description}</p>
      )}

      <div className="dash-map-detail-meta">
        <span
          className={`dash-map-type-pill ${isNeeds ? "dash-map-type-pill-needs" : "dash-map-type-pill-offers"}`}
        >
          {postTypeLabel(post.post_type)}
        </span>
        <span className="dash-map-detail-tag">{post.category}</span>
        <span className="dash-map-detail-tag dash-map-detail-hours">
          <Clock size={11} />
          {post.hours_cost}h
        </span>
      </div>

      <div className="dash-map-detail-location">
        <MapPin size={12} className="dash-accent flex-shrink-0" />
        <span>
          {formatPostLocation(post)}
          {!worldwide && post.distanceMiles != null && (
            <> · {formatDistance(post.distanceMiles)} away</>
          )}
        </span>
        <span className="dash-map-detail-format">{formatExchangeFormat(post.exchange_format)}</span>
      </div>

      {onOpenBoard && (
        <button type="button" onClick={onOpenBoard} className="dash-map-detail-cta">
          Open on Job Board
        </button>
      )}
    </div>
  );
}

interface NearbyMapProps {
  userLocation: UserLocation;
  posts: NearbyPost[];
  radiusMiles: number;
  worldwide?: boolean;
  showUserMarker?: boolean;
  selectedPost?: NearbyPost | null;
  onSelectPost?: (post: NearbyPost) => void;
  onClosePost?: () => void;
  onOpenBoard?: (post: NearbyPost) => void;
}

export function NearbyMap({
  userLocation,
  posts,
  radiusMiles,
  worldwide = false,
  showUserMarker = true,
  selectedPost = null,
  onSelectPost,
  onClosePost,
  onOpenBoard,
}: NearbyMapProps) {
  const center: [number, number] = [userLocation.latitude, userLocation.longitude];
  const mapPosts = useMemo(
    () => posts.filter((post) => post.latitude != null && post.longitude != null),
    [posts],
  );
  const needsCount = mapPosts.filter((p) => p.post_type === "needs").length;
  const offersCount = mapPosts.filter((p) => p.post_type === "offers").length;
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
          scrollWheelZoom
          zoomControl={false}
          className="dash-map-leaflet w-full z-0"
          style={{ background: "#a8d4f0" }}
        >
          <ZoomControl position="topleft" />
          <TileLayer
            attribution='&copy; OpenStreetMap &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {worldwide ? (
            <MapWorldViewport
              center={center}
              posts={mapPosts}
              includeUserCenter={showUserMarker}
              frozen={Boolean(selectedPost)}
            />
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
          {selectedPost && <MapFocusPost post={selectedPost} />}
          {showUserMarker && (
            <Marker position={center} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {mapPosts.map((post) => (
              <Marker
                key={post.id}
                position={[post.latitude!, post.longitude!]}
                icon={postIconForType(post.post_type)}
              >
                <Popup
                  closeOnClick={false}
                  autoClose={false}
                  eventHandlers={{
                    add(event) {
                      const root = event.target.getElement();
                      if (!root) return;
                      L.DomEvent.disableClickPropagation(root);
                      L.DomEvent.disableScrollPropagation(root);
                      const content = root.querySelector(".leaflet-popup-content");
                      if (content instanceof HTMLElement) {
                        L.DomEvent.disableClickPropagation(content);
                        L.DomEvent.disableScrollPropagation(content);
                      }
                    },
                  }}
                >
                  <MapPopupContent
                    post={post}
                    worldwide={worldwide}
                    onSelectPost={onSelectPost}
                  />
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {selectedPost && onClosePost && (
        <MapListingDetail
          post={selectedPost}
          worldwide={worldwide}
          onClose={onClosePost}
          onOpenBoard={onOpenBoard ? () => onOpenBoard(selectedPost) : undefined}
        />
      )}

      <div className="dash-map-win7-statusbar">
        <div className="dash-map-legend">
          <span>{mapPosts.length} listing{mapPosts.length === 1 ? "" : "s"} on map</span>
          <span className="dash-map-legend-item">
            <span className="dash-map-legend-dot dash-map-legend-dot-needs" aria-hidden="true" />
            Needs help ({needsCount})
          </span>
          <span className="dash-map-legend-item">
            <span className="dash-map-legend-dot dash-map-legend-dot-offers" aria-hidden="true" />
            Offering ({offersCount})
          </span>
        </div>
        <span>© OpenStreetMap · CARTO</span>
      </div>
    </div>
  );
}
