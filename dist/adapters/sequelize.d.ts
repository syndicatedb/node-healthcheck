import { Adapter } from '../index';
export interface ISequelize {
    query: (sql: string, opts?: any) => any;
    config: {
        username: string;
    };
}
interface IOpts {
    sequelize: ISequelize;
    componentName?: string;
}
declare const adapter: Adapter<IOpts>;
export default adapter;
