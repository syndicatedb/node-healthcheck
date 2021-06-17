import { Check } from '../index';
import { Method } from 'axios';
interface IOpts {
    url: string;
    method: Method;
    body?: any;
    params?: any;
    headers?: any;
    componentName?: string;
}
declare const adapter: Check<IOpts>;
export default adapter;
