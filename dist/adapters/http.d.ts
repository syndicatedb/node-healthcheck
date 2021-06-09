import { Adapter } from '../index';
import { Method } from 'axios';
interface IOpts {
    url: string;
    method: Method;
    body?: any;
    params?: any;
    componentName?: string;
}
declare const adapter: Adapter<IOpts>;
export default adapter;
