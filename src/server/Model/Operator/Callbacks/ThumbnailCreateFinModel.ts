import * as fs from 'fs';
import { IPCServerInterface } from '../../IPC/IPCServer';
import Model from '../../Model';
import { RecordedManageModelInterface } from '../../Operator/Recorded/RecordedManageModel';
import { ThumbnailManageModelInterface } from '../../Operator/Thumbnail/ThumbnailManageModel';
import CallbackBaseModelInterface from './CallbackBaseModelInterface';

class ThumbnailCreateFinModel extends Model implements CallbackBaseModelInterface {
    private recordedManage: RecordedManageModelInterface;
    private thumbnailManage: ThumbnailManageModelInterface;
    private ipc: IPCServerInterface;

    constructor(
        recordedManage: RecordedManageModelInterface,
        thumbnailManage: ThumbnailManageModelInterface,
        ipc: IPCServerInterface,
    ) {
        super();

        this.recordedManage = recordedManage;
        this.thumbnailManage = thumbnailManage;
        this.ipc = ipc;
    }

    public set(): void {
        this.thumbnailManage.addListener((id, thumbnailPath) => { this.callback(id, thumbnailPath); });
    }

    /**
     * @param recordedId: recorded id
     * @param thumbnailPath: thumbnail file path
     */
    private async callback(recordedId: number, thumbnailPath: string): Promise<void> {
        try {
            await this.recordedManage.addThumbnail(recordedId, thumbnailPath);

            // encoding 番組のサムネイル状態更新依頼
            this.ipc.updateEncodingProgramgStatus(recordedId);

            // socket.io で通知
            this.ipc.notifIo();
        } catch (err) {
            this.log.system.error(`thumbnail add error: ${ recordedId }`);
            this.log.system.error(err);

            // サムネイル削除
            this.log.system.error(`delete thumbnail: ${ thumbnailPath }`);
            fs.unlink(thumbnailPath, (e) => {
                if (e) {
                    this.log.system.error(`delete thumbnail error: ${ thumbnailPath }`);
                    this.log.system.error(e.message);
                }
            });
        }
    }
}

export default ThumbnailCreateFinModel;

