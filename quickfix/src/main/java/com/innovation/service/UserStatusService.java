package com.innovation.service;

import com.innovation.model.User;
import com.innovation.model.UserActivityStatus;
import com.innovation.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class UserStatusService {

    private final UserRepository userRepository;

    public UserStatusService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void transitionToWaiting(User user) {
        updateStatus(user, UserActivityStatus.WAITING);
    }

    @Transactional
    public void transitionToAssigned(User user, User worker) {
        updateStatus(worker, UserActivityStatus.ASSIGNED);
        updateStatus(user, UserActivityStatus.ASSIGNED);
    }

    @Transactional
    public void transitionToCompleted(User user, User worker) {
        updateStatus(user, UserActivityStatus.COMPLETED);
        updateStatus(worker, UserActivityStatus.COMPLETED);
    }

    private void updateStatus(User user, UserActivityStatus newStatus) {
        if (user != null) {
            user.setStatus(newStatus);
            userRepository.save(user);
        }
    }
}