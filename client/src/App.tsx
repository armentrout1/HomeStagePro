import { Route, Switch, useLocation } from "wouter";
import { Suspense, lazy, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import NotFound from "@/pages/not-found";
import { SeoHead } from "@/seo/SeoHead";

const HomeStagingTips = lazy(() => import("./pages/HomeStagingTips"));
const RealEstatePhotos = lazy(() => import("./pages/RealEstatePhotos"));
const VirtualVsTraditional = lazy(() => import("./pages/VirtualVsTraditional"));
const VirtualStaging = lazy(() => import("./pages/VirtualStaging"));
const AffordableVirtualStaging = lazy(
  () => import("./pages/AffordableVirtualStaging"),
);
const VirtualStagingForAgents = lazy(
  () => import("./pages/VirtualStagingForAgents"),
);
const VirtualStagingForInvestors = lazy(
  () => import("./pages/VirtualStagingForInvestors"),
);
const VirtualStagingCost = lazy(() => import("./pages/VirtualStagingCost"));
const VirtualStagingForShortTermRentals = lazy(
  () => import("./pages/VirtualStagingForShortTermRentals"),
);
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Gallery = lazy(() => import("./pages/Gallery"));
const SellingTips = lazy(() => import("./pages/SellingTips"));
const Sales = lazy(() => import("./pages/Sales"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Resources = lazy(() => import("./pages/Resources"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));

const GalleryRouteContent = () => (
  <>
    <SeoHead path="/gallery" />
    <Gallery />
  </>
);

function Router() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [useLocation()[0]]);

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="p-8 text-sm text-muted-foreground">Loading…</div>
        }
      >
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
          <Route path="/virtual-staging-for-real-estate-agents">
            <>
              <SeoHead path="/virtual-staging-for-real-estate-agents" />
              <VirtualStagingForAgents />
            </>
          </Route>
          <Route path="/virtual-staging-for-investors">
            <>
              <SeoHead path="/virtual-staging-for-investors" />
              <VirtualStagingForInvestors />
            </>
          </Route>
          <Route path="/virtual-staging-for-short-term-rentals">
            <>
              <SeoHead path="/virtual-staging-for-short-term-rentals" />
              <VirtualStagingForShortTermRentals />
            </>
          </Route>
          <Route path="/virtual-staging-cost">
            <>
              <SeoHead path="/virtual-staging-cost" />
              <VirtualStagingCost />
            </>
          </Route>
          <Route path="/gallery">
            <GalleryRouteContent />
          </Route>
          <Route path="/gallery/">
            <GalleryRouteContent />
          </Route>
          <Route path="/how-it-works">
            <>
              <SeoHead path="/how-it-works" />
              <HowItWorks />
            </>
          </Route>
          <Route path="/selling-tips">
            <>
              <SeoHead path="/selling-tips" />
              <SellingTips />
            </>
          </Route>
          <Route path="/affordable-virtual-staging">
            <>
              <SeoHead path="/affordable-virtual-staging" />
              <AffordableVirtualStaging />
            </>
          </Route>
          <Route path="/sales">
            <>
              <SeoHead path="/sales" />
              <Sales />
            </>
          </Route>
          <Route path="/resources">
            <>
              <SeoHead path="/resources" />
              <Resources />
            </>
          </Route>
          <Route path="/privacy">
            <>
              <SeoHead path="/privacy" />
              <PrivacyPolicy />
            </>
          </Route>
          <Route path="/terms">
            <>
              <SeoHead path="/terms" />
              <TermsOfService />
            </>
          </Route>
          <Route path="/about">
            <>
              <SeoHead path="/about" />
              <About />
            </>
          </Route>
          <Route path="/contact">
            <>
              <SeoHead path="/contact" />
              <Contact />
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
      </Suspense>
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
