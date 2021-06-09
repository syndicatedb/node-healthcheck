"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upTimeAdapter = exports.sequelizeAdapter = exports.rabbitMQAdapter = exports.queueAdapter = exports.memoryUsageAdapter = exports.httpAdapter = void 0;
const http_1 = __importDefault(require("./http"));
exports.httpAdapter = http_1.default;
const memoryUsage_1 = __importDefault(require("./memoryUsage"));
exports.memoryUsageAdapter = memoryUsage_1.default;
const queue_1 = __importDefault(require("./queue"));
exports.queueAdapter = queue_1.default;
const rabbitMQ_1 = __importDefault(require("./rabbitMQ"));
exports.rabbitMQAdapter = rabbitMQ_1.default;
const sequelize_1 = __importDefault(require("./sequelize"));
exports.sequelizeAdapter = sequelize_1.default;
const upTime_1 = __importDefault(require("./upTime"));
exports.upTimeAdapter = upTime_1.default;
//# sourceMappingURL=index.js.map