import { Adapter } from '../index';
interface IOpts {
    url: string;
    componentName?: string;
}
declare const adapter: Adapter<IOpts>;
export default adapter;
