import { Avatar, Box, Skeleton } from "@mui/material";
import {
  BlockIconContainer,
  BottomParent,
  FileContainer,
  IconsBox,
  NameContainer,
  VideoCard,
  VideoCardName,
  VideoCardTitle,
  VideoUploadDate,
} from "./IssueList-styles.tsx";
import EditIcon from "@mui/icons-material/Edit";
import {
  blockUser,
  setEditFile,
  Video,
} from "../../state/features/fileSlice.ts";
import BlockIcon from "@mui/icons-material/Block";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { formatBytes } from "../IssueContent/IssueContent.tsx";
import { formatDate } from "../../utils/time.ts";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store.ts";
import { useNavigate } from "react-router-dom";
import { getIconsFromObject } from "../../constants/Categories/CategoryFunctions.ts";

interface FileListProps {
  files: Video[];
}
export const IssueList = ({ files }: FileListProps) => {
  const hashMapFiles = useSelector(
    (state: RootState) => state.file.hashMapFiles
  );

  const [showIcons, setShowIcons] = useState(null);
  const username = useSelector((state: RootState) => state.auth?.user?.name);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const blockUserFunc = async (user: string) => {
    if (user === "Q-Support") return;

    try {
      const response = await qortalRequest({
        action: "ADD_LIST_ITEMS",
        list_name: "blockedNames",
        items: [user],
      });

      if (response === true) {
        dispatch(blockUser(user));
      }
    } catch (error) {}
  };

  return (
    <FileContainer>
      {files.map((file: any, index: number) => {
        const existingFile = hashMapFiles[file?.id];
        let hasHash = false;
        let fileObj = file;
        if (existingFile) {
          fileObj = existingFile;
          hasHash = true;
        }
        const icon = getIconsFromObject(fileObj);
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: "75px",
              position: "relative",
            }}
            key={fileObj.id}
            onMouseEnter={() => setShowIcons(fileObj.id)}
            onMouseLeave={() => setShowIcons(null)}
          >
            {hasHash ? (
              <>
                <IconsBox
                  sx={{
                    opacity: showIcons === fileObj.id ? 1 : 0,
                    zIndex: 2,
                  }}
                >
                  {fileObj?.user === username && (
                    <BlockIconContainer
                      onClick={() => {
                        dispatch(setEditFile(fileObj));
                      }}
                    >
                      <EditIcon />
                      Edit Issue
                    </BlockIconContainer>
                  )}

                  {fileObj?.user !== username && (
                    <BlockIconContainer
                      onClick={() => {
                        blockUserFunc(fileObj?.user);
                      }}
                    >
                      <BlockIcon />
                      Block User
                    </BlockIconContainer>
                  )}
                </IconsBox>
                <VideoCard
                  onClick={() => {
                    navigate(`/issue/${fileObj?.user}/${fileObj?.id}`);
                  }}
                  sx={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    gap: "25px",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: "25px",
                      alignItems: "center",
                    }}
                  >
                    {icon ? (
                      <img
                        src={icon}
                        width="50px"
                        style={{
                          borderRadius: "5px",
                        }}
                      />
                    ) : (
                      <AttachFileIcon />
                    )}

                    <VideoCardTitle
                      sx={{
                        width: "100px",
                      }}
                    >
                      {formatBytes(
                        fileObj?.files.reduce(
                          (acc, cur) => acc + (cur?.size || 0),
                          0
                        )
                      )}
                    </VideoCardTitle>
                    <VideoCardTitle>{fileObj.title}</VideoCardTitle>
                  </Box>
                  <BottomParent>
                    <NameContainer
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/channel/${fileObj?.user}`);
                      }}
                    >
                      <Avatar
                        sx={{ height: 24, width: 24 }}
                        src={`/arbitrary/THUMBNAIL/${fileObj?.user}/qortal_avatar`}
                        alt={`${fileObj?.user}'s avatar`}
                      />
                      <VideoCardName
                        sx={{
                          ":hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {fileObj?.user}
                      </VideoCardName>
                    </NameContainer>

                    {fileObj?.created && (
                      <VideoUploadDate>
                        {formatDate(fileObj.created)}
                      </VideoUploadDate>
                    )}
                  </BottomParent>
                </VideoCard>
              </>
            ) : (
              <Skeleton
                variant="rectangular"
                style={{
                  width: "100%",
                  height: "100%",
                  paddingBottom: "10px",
                  objectFit: "contain",
                  visibility: "visible",
                  borderRadius: "8px",
                }}
              />
            )}
          </Box>
        );
      })}
    </FileContainer>
  );
};
