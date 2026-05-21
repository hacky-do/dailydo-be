Feature: 사용자 인증 기능

  Scenario: 사용자 로그인
    Given 사용자 정보를 fixture에서 가져옴
    Then 사용자가 이메일 로그인에 성공했다
