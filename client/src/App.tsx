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
import VirtualStaging from "./pages/VirtualStaging";
import SellingTips from "./pages/SellingTips";
import NotFound from "@/pages/not-found";

// Import the new pages
import Upgrade from "./pages/Upgrade";
import ThankYou from "./pages/ThankYou";
import Sales from "./pages/Sales";
import { SeoHead } from "@/seo/SeoHead";

function Router() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [useLocation()[0]]);

  return (
    <Layout>
      <Switch>
        <Route path="/">
          <>
            <SeoHead path="/" />
            <Home />
          </>
        </Route>
        <Route path="/home-staging-tips">
          <>
            <SeoHead path="/home-staging-tips" />
            <HomeStagingTips />
          </>
        </Route>
        <Route path="/real-estate-photos">
          <>
            <SeoHead path="/real-estate-photos" />
            <RealEstatePhotos />
          </>
        </Route>
        <Route path="/virtual-vs-traditional">
          <>
            <SeoHead path="/virtual-vs-traditional" />
            <VirtualVsTraditional />
          </>
        </Route>
        <Route path="/virtual-staging">
          <>
            <SeoHead path="/virtual-staging" />
            <VirtualStaging />
          </>
        </Route>
        <Route path="/selling-tips">
          <>
            <SeoHead path="/selling-tips" />
            <SellingTips />
          </>
        </Route>
        <Route path="/sales">
          <>
            <SeoHead path="/sales" />
            <Sales />
          </>
        </Route>
        <Route path="/upgrade">
          <>
            <SeoHead path="/upgrade" />
            <Upgrade />
          </>
        </Route>
        <Route path="/thank-you">
          <>
            <SeoHead path="/thank-you" />
            <ThankYou />
          </>
        </Route>
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
