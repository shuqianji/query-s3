import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const SET_DATA = "setData";

const storInit = {
  bucketList: [],
};
const storState = {
  ...storInit,
};
for (const key in storState) {
  let val = localStorage[key];
  try {
    if (val) storState[key] = JSON.parse(val);
  } catch (error) {
    console.log(key, error);
  }
}

const store = new Vuex.Store({
  state: {
    ...storState,
    nowDate: new Date(),
    ...getWH(),
    isTouch: "ontouchstart" in window,
    isFocus: true,
    noticeMsg: {},
    curPath: "/",
    curBucket: {},
    qs3: null,
  },
  mutations: {
    [SET_DATA](state, data) {
      for (const key in data) {
        state[key] = data[key];
      }
    },
  },
});

export const setState = (data) => {
  store.commit(SET_DATA, data);
};

export const setStore = (data) => {
  for (const key in data) {
    try {
      localStorage[key] = JSON.stringify(data[key]);
    } catch (error) {
      console.log(key, error);
    }
  }
  setState(data);
};

Vue.prototype.$setState = setState;
Vue.prototype.$setStore = setStore;

Vue.prototype.$setMsg = (noticeMsg) => {
  setState({
    noticeMsg,
  });
};

function getWH() {
  const { clientWidth, clientHeight } = document.documentElement;
  const asMobile = clientWidth < 700;
  return {
    clientWidth,
    clientHeight,
    asMobile,
  };
}
window.onresize = () => {
  setState({
    ...getWH(),
  });
};
window.onblur = () => {
  setState({
    isFocus: false,
  });
};
window.onfocus = () => {
  const isTouch = "ontouchstart" in window;
  setState({
    isFocus: true,
    isTouch,
  });
};

setInterval(() => {
  setState({
    nowDate: new Date(),
  });
}, 1e3);

export default store;
