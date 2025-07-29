export type EventTriggerObject = {
  [name: string]: {
    [id: string]: CallableFunction;
  };
};
