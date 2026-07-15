import { useState, useEffect, useMemo } from "react";
import { deleteUser, listenToUsers, updateUser } from "../services/userService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = listenToUsers(
      (items) => {
        setUsers(items);
        setLoading(false);
      },
      (err) => {
        const msg = err?.code === "permission-denied"
          ? "Permission denied. Check Firestore rules allow read access."
          : getFirebaseErrorMessage(err);
        setError(msg);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const stats = useMemo(
    () => ({
      count: users.length,
      adminCount: users.filter((u) => u.role === "admin").length,
      userCount: users.filter((u) => u.role === "user").length
    }),
    [users]
  );

  return { users, loading, error, stats, updateUser, deleteUser };
}
