// Класс является сервером обработки запросов.
// в конструкторе передается транспорт, и настройки кластеризации
// сервер может работать как в одном процессе так и порождать для обработки запросов дочерние процессы.
// Задача дописать недостающие части и отрефакторить существующий код.
// Использовать функционал модуля cluster - не лучшая идея. Предпочтительный вариант - порождение процессов через child_process
// Мы ожидаем увидеть реализацию работы с межпроцессным взаимодействием в том виде, в котором вы сможете. 
// Контроль жизни дочерних процессов должен присутствовать в качестве опции. 
// Должна быть возможность включать\отключать пересоздание процессов в случае падения 
// Предпочтительно увидеть различные режимы балансировки входящих запросов.
//
// Не важно, http/ws/tcp/ или простой сокет это все изолируется в транспорте.
// Единственное что знает сервис обработки запросов это тип подключения транспорта, постоянный или временный
// и исходя из этого создает нужную конфигурацию. ну и еще от того какой режим кластеризации был выставлен
// В итоговом варианте ожидаем увидеть код в какой-либо системе контроля версия (github, gitlab) на ваш выбор
// Примеры использования при том или ином транспорте
// Будет плюсом, если задействуете в этом деле typescript и статическую типизацию.
// Вам не нужна привязка к каким-либо фрэймворкам или нестандартным библиотекам. Все реализуется при помощи встроенных модулей nodejs
// Если вам что-то не понятно, задавайте вопросы.
// Если вы не умеете применять принципы ООП, не начинайте задание
// Если вы не готовы тратить время на задачу, говорите об этом сразу и не приступайте к выполнению.


import { createServer } from 'http';
import {cpus} from 'os';
import { IOption, IService } from './interfaces';
import * as _cluster from 'cluster';

// cluster type-fix
const cluster = _cluster as unknown as _cluster.Cluster;


class Service implements IService {
    transport: {isPermanentConnection: boolean}
    isClusterMode: boolean
    clusterOptions: string | undefined
    isMaster = false
    reestablish = false
    
    constructor(options: IOption) {
        this.transport = options.transport;
        this.isClusterMode = !!options.cluster;
        if( this.isClusterMode ) {
            this.clusterOptions = options.cluster;
            this.reestablish = options.reestablish
        }                
    }

    async start() {
        if( this.isClusterMode ) {
            if( cluster.isMaster ) {
                await this.startCluster();
                if( this.transport.isPermanentConnection ) {
                    await this.startTransport();
                }
            } else {
                await this.startWorker();
                if( !this.transport.isPermanentConnection ) {
                    await this.startTransport();
                }
            }
        }
        else {
            await this.startWorker();
            await this.startTransport();
        }
    }

    async startTransport() {
        //todo: логика запуска транспорта
        
    }

    async startWorker() {
        //todo: логика запуска обработчика запросов

        createServer(
            (req, res) => res.end('Server response')
        ).listen(
            () => console.log('Server is started on ' + process.pid)
        )
    }

    async startCluster() {
        //todo: логика запуска дочерних процессов
        const cores = cpus()

        // for(let i = 0; i < cpus - 1; i++) {
        for(let cpu in cores) {
            const worker = cluster.fork()
            console.log(`[INFO] - worker on PID: ${worker.process.pid}`);

            if(this.reestablish) {
                worker.on('exit', () => {
                    // when worker dies
                    console.log(`[INFO] - worker with PID ${worker.process.pid} went down`);
                    cluster.fork()
                })
            }
        }
    }
}


async function boot(): Promise<void> {
    const serv = new Service({
        transport: {
            isPermanentConnection: true
        }, 
        cluster: 'cluster_mode',
        reestablish: false
    })

    await serv.start()
}

boot()