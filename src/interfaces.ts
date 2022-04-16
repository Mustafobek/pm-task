export interface IOption {
    transport: {isPermanentConnection: boolean}
    cluster: string
    reestablish: boolean
}

export interface IService {
    start: () => Promise<void>
    startTransport: () => Promise<void>
    startWorker: () => Promise<void>
    startCluster: () => Promise<void>
}