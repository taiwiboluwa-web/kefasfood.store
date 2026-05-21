import { createBrowserRouter } from "react-router";
import { MainPage } from "./MainPage";
import { AdminVisits } from "./AdminVisits";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainPage,
  },
  {
    path: "/admin",
    Component: AdminVisits,
  }
]);