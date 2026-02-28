package com.pm.pmresource.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_document", indexes = {
        @Index(name = "idx_pd_project_id", columnList = "project_id"),
        @Index(name = "idx_pd_document_id", columnList = "document_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ProjectDocument extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "original_filename", nullable = false, length = 500)
    private String originalFilename;

    @Column(name = "file_type", length = 20)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Builder.Default
    @Column(name = "act_st", nullable = false, length = 20)
    private String actSt = "ACTIVATE";

    public void softDelete() {
        this.actSt = "DELETE";
    }
}
