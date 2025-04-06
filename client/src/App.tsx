import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import HomeStagingTips from "./pages/HomeStagingTips";
import RealEstatePhotos from "./pages/RealEstatePhotos";
import VirtualVsTraditional from "./pages/VirtualVsTraditional";
import SellingTips from "./pages/SellingTips";
import NotFound from "@/pages/not-found";

// Import the new pages
import Upgrade from "./pages/Upgrade";
import ThankYou from "./pages/ThankYou";
import Sales from "./pages/Sales";

function Router() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [useLocation()[0]]);

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home-staging-tips" component={HomeStagingTips} />
        <Route path="/real-estate-photos" component={RealEstatePhotos} />
        <Route path="/virtual-vs-traditional" component={VirtualVsTraditional} />
        <Route path="/selling-tips" component={SellingTips} />
        <Route path="/sales" component={Sales} />
        <Route path="/upgrade" component={Upgrade} />
        <Route path="/thank-you" component={ThankYou} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
