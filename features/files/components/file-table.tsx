"use client";

import { Fragment, useState } from "react";
import { Download, Pause, Play, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDate } from "@/features/files/lib/format";
import { AudioPlayer } from "@/features/files/components/audio-player";
import { FileActionDialogs } from "@/features/files/components/file-action-dialogs";
import { useFileActions } from "@/features/files/hooks/use-file-actions";

type FileRow = {
  id: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: Date;
};

export function FileTable({ files }: { files: FileRow[] }) {
  const actions = useFileActions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (files.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No files uploaded yet.
      </p>
    );
  }

  return (
    <>
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-64" />
          <col className="w-20" />
          <col className="w-32" />
          <col className="w-28" />
        </colgroup>
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 pl-4 font-medium">Size</th>
            <th className="py-2 pr-4 font-medium">Uploaded</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const isAudio = file.contentType.startsWith("audio/");
            const isPhoto = file.contentType.startsWith("image/");
            const isExpanded = expandedId === file.id;
            const isPlaying = isExpanded && playingId === file.id;

            function togglePlayback() {
              if (isExpanded) {
                setExpandedId(null);
                setPlayingId(null);
              } else {
                setExpandedId(file.id);
              }
            }

            return (
              <Fragment key={file.id}>
                <tr
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", file.id)}
                  className="border-b last:border-0"
                >
                  <td className="py-2 pr-4">
                    <div className="flex min-w-0 items-center gap-2">
                      {isAudio && (
                        <Button variant="ghost" size="icon-sm" onClick={togglePlayback}>
                          {isPlaying ? <Pause /> : <Play />}
                          <span className="sr-only">
                            {isPlaying ? "Pause" : "Play"} {file.name}
                          </span>
                        </Button>
                      )}
                      {isPhoto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/files/${file.id}/download`}
                          alt=""
                          className="size-8 shrink-0 rounded object-cover"
                        />
                      )}
                      <span className="truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 pl-4 whitespace-nowrap text-muted-foreground">
                    {formatBytes(file.size)}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                    {formatDate(file.createdAt)}
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => actions.openShare({ id: file.id, name: file.name })}
                      >
                        <Share2 />
                        <span className="sr-only">Share {file.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<a href={`/api/files/${file.id}/download`} />}
                      >
                        <Download />
                        <span className="sr-only">Download {file.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => actions.setPendingDeleteId(file.id)}
                      >
                        <Trash2 />
                        <span className="sr-only">Delete {file.name}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
                {isAudio && isExpanded && (
                  <tr className="border-b last:border-0">
                    <td colSpan={4} className="pb-3">
                      <AudioPlayer
                        src={`/api/files/${file.id}/download`}
                        autoPlay
                        onPlayStateChange={(playing) => setPlayingId(playing ? file.id : null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <FileActionDialogs {...actions} />
    </>
  );
}
