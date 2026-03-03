package com.pm.pmworkflow.service;

import com.pm.pmworkflow.domain.entity.SuggestedQuestion;
import com.pm.pmworkflow.domain.repository.SuggestedQuestionRepository;
import com.pm.pmworkflow.dto.response.SuggestedQuestionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuggestedQuestionService {

    private final SuggestedQuestionRepository suggestedQuestionRepository;

    @Transactional
    public void saveAll(List<SuggestedQuestion> questions) {
        suggestedQuestionRepository.saveAll(questions);
        log.info("Saved {} suggested questions", questions.size());
    }

    @Transactional(readOnly = true)
    public List<SuggestedQuestionResponse> getByProjectId(Long projectId) {
        return suggestedQuestionRepository
                .findByProjectIdAndUsedFalseOrderByCreatedAtDesc(projectId)
                .stream()
                .map(SuggestedQuestionResponse::from)
                .toList();
    }
}
