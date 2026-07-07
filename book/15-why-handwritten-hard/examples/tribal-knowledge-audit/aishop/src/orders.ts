// TODO: legacy_channel 字段为什么不能删？对账系统还在读，但没人说得清具体哪个
export interface Order {
  id: string;
  legacy_channel: string;
}
