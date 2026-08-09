import { Component } from "react";

export default class AppLoadBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Unable to load Piyali", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="app-load-error" role="alert">
        <div className="app-load-error__card">
          <h1>Piyali couldn&apos;t finish loading</h1>
          <p>
            The local app server may have restarted or disconnected. Reload the
            page once it is running again.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload Piyali
          </button>
        </div>
      </div>
    );
  }
}
