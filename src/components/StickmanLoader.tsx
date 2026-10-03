import React from "react";
import ShopiversityLoader from "./ShopiversityLoader";

export default function StickmanLoader() {
  return (
    <ShopiversityLoader 
      fullScreen={false} 
      message="Connecting safely to Shopiversity..." 
    />
  );
}
