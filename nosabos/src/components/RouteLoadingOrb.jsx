import React from "react";

export default function RouteLoadingOrb({ size = 88 }) {
  return (
    <div
      className="route-loading-orb-container"
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    >
      <div className="route-loading-orb" />
    </div>
  );
}
