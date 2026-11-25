export class MqttTopics {
  static status(intersectionId: string): string {
    return `traffic/intersections/${intersectionId}/status`;
  }

  static commands(intersectionId: string): string {
    return `traffic/intersections/${intersectionId}/commands`;
  }

  static config(intersectionId: string): string {
    return `traffic/intersections/${intersectionId}/config`;
  }

  static ack(intersectionId: string): string {
    return `traffic/intersections/${intersectionId}/ack`;
  }

  static heartbeat(intersectionId: string): string {
    return `traffic/intersections/${intersectionId}/heartbeat`;
  }

  static wildcardAll(): string {
    return 'traffic/intersections/#';
  }
}
