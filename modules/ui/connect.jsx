import React from 'react';
import PropTypes from 'prop-types';

export default function connect(WrappedComponent, tokens, {staticProps, mapProps, mapActions, mapSelfProps}) {

  mapProps = createMapper(mapProps);

  mapActions = mapActions || function(dispatch) {
    return dispatch;
  };

  mapSelfProps = mapSelfProps || (() => undefined);
  
  return class StateConnector extends React.PureComponent {

    constructor(props) {
      super();
      this.mounted = false;
      this.stateProps = {};
      this.dispatchProps = mapActions(this.dispatch, props);
    }

    componentWillMount() {
      this.externalStateConnection = this.context.bus.connectToState(this.getTokens(), this.setExternalState);
      this.externalStateConnection();
    }

    getTokens() {
      let tokensArr = tokens instanceof Function ? tokens(this.props) : tokens; 
      if (!Array.isArray(tokensArr)) {
        tokensArr = [tokensArr];
      }
      return tokensArr;
    }
    
    componentDidMount() {
      this.mounted = true;
    }

    componentWillUnmount() {
      this.mounted = false;
      this.context.bus.disconnectFromState(this.externalStateConnection);
    }

    setExternalState = (state) => {
      this.stateProps = mapProps(state, this.props);
      if (this.mounted) {
        this.forceUpdate();
      }
    };

    dispatch = (event, data) => {
      this.context.bus.dispatch(event, data);
    };

    render() {
      return <WrappedComponent {...this.stateProps} 
                               {...this.dispatchProps} 
                               {...staticProps} 
                               {...mapSelfProps(this.props)}/>
    }

    componentDidCatch() {
    }

    static contextTypes = {
      bus: PropTypes.object
    };
  }
}

function createMapper(mapper, comp) {
  if (!mapper) {
    return DEFAULT_MAPPER;
  } else if (Array.isArray(mapper)) {
    return function (state) {
      let props = {};
      for (let i = 0; i < state.length; i++) {
        let stateItem = state[i];
        let mapperItem = mapper[i];
        Object.assign(props, mapperItem ? mapperItem(stateItem) : stateItem)
      }
      return props;
    };
  }
  return mapper;
}

export function DEFAULT_MAPPER(state) {
  let props = {};
  state.forEach(stateItem => Object.assign(props, stateItem));
  return props;
}