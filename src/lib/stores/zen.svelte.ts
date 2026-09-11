class ZenStore {
  active = $state(false);

  set(val: boolean) {
    this.active = val;
  }
}

export const zen = new ZenStore();
