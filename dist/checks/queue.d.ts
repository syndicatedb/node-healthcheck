import { Check } from '../index';
export interface IQueue {
    checkExchange?: (exchange: string) => Promise<any>;
    checkQueue: (queue: string) => Promise<any>;
}
interface IOpts {
    queue: IQueue;
    queueName: string;
    exchangeName?: string;
    componentName?: string;
}
declare const adapter: Check<IOpts>;
export default adapter;
