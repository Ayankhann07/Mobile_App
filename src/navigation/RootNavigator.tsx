import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import { useDeepLinking } from "../hooks/useDeepLinking";
import { SplashScreen } from "../screens/SplashScreen";
import { AuthStack } from "./AuthStack";
import { AppDrawer } from "./AppDrawer";
import { navigationRef } from "./navigationRef";
import { linking } from "./linking";

export function RootNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();
  useDeepLinking();

  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      {isAuthenticated ? <AppDrawer /> : <AuthStack />}
    </NavigationContainer>
  );
}
