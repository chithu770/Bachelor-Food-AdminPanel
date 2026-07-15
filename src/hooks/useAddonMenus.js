import { useState } from "react";

export function useAddonMenus() {
  const [menus] = useState([]);
  return { menus, loading: false, error: null, refetch: () => {} };
}