import { createDrawerNavigator } from "@react-navigation/drawer";
import { AppStack } from "./AppStack";
import { DrawerContent } from "./DrawerContent";
import { IncomingGiftsProvider } from "../context/IncomingGiftsContext";
import { colors } from "../utils/theme";
import type { AppDrawerParamList } from "./types";

const Drawer = createDrawerNavigator<AppDrawerParamList>();

export function AppDrawer() {
  return (
    <IncomingGiftsProvider>
      <Drawer.Navigator
        screenOptions={{
          headerShown: false,
          drawerType: "front",
          overlayColor: "rgba(74,22,32,0.45)",
          drawerStyle: { width: "80%", backgroundColor: colors.surface },
        }}
        drawerContent={(props) => <DrawerContent {...props} />}
      >
        <Drawer.Screen name="AppStack" component={AppStack} />
      </Drawer.Navigator>
    </IncomingGiftsProvider>
  );
}
