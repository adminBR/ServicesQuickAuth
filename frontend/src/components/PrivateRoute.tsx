import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

interface PrivateRouteProps {
  children: JSX.Element;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const valid = await isAuthenticated();
      setAuthorized(valid);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;
  return authorized ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
