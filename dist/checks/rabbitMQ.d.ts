import { Check } from '../index';
interface IOpts {
    url: string;
    componentName?: string;
}
declare const adapter: Check<IOpts>;
export default adapter;
